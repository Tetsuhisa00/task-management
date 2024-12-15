require "test_helper"

class WbsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get wbs_index_url
    assert_response :success
  end
end
